<?php
/**
 * Template: Página de Tag
 * Listado de posts por etiqueta con noindex, follow.
 *
 * @package GeneratePress Child
 */

get_header(); ?>

<div class="blog-layout-full">

    <?php pyablog_breadcrumbs(); ?>

    <div class="post-grid-wrap">
        <a href="/blog/" class="back-link">← Volver al blog</a>

        <header class="category-header">
            <h1>Tag: <?php single_tag_title(); ?></h1>
            <?php
            $tag = get_queried_object();
            if ($tag && tag_description()) :
            ?>
                <p><?php echo tag_description(); ?></p>
            <?php endif; ?>
        </header>

        <?php if (have_posts()) : ?>
            <div class="post-grid grid-3">
                <?php while (have_posts()) : the_post(); ?>
                    <article class="grid-item">
                        <?php if (has_post_thumbnail()) : ?>
                        <div class="grid-item-image">
                            <?php the_post_thumbnail('medium'); ?>
                        </div>
                        <?php endif; ?>
                        <div class="grid-item-body">
                            <?php pyablog_category_badge(); ?>
                            <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                            <p><?php echo esc_html(wp_trim_words(get_the_excerpt(), 20)); ?></p>
                            <div class="post-meta">
                                <time datetime="<?php echo get_the_date('c'); ?>"><?php echo get_the_date('j M Y'); ?></time>
                                <?php pyablog_reading_time_html(); ?>
                            </div>
                        </div>
                    </article>
                <?php endwhile; ?>
            </div>

            <div class="pagination-wrap">
                <?php
                echo paginate_links([
                    'mid_size'  => 2,
                    'prev_text' => '← Anterior',
                    'next_text' => 'Siguiente →',
                ]);
                ?>
            </div>
        <?php else : ?>
            <div class="empty-state">
                <p>No hay artículos con esta etiqueta.</p>
                <a href="/blog/" class="back-link" style="display:inline;">← Ver todos los artículos</a>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php get_footer(); ?>
