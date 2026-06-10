<?php
/**
 * Template: Página de Autor
 * Perfil público del autor con listado de sus posts.
 *
 * @package GeneratePress Child
 */

get_header(); ?>

<div class="blog-layout-full">

    <?php pyablog_breadcrumbs(); ?>

    <div class="post-grid-wrap">
        <header class="author-header">
            <div class="author-avatar" style="margin:0 auto 16px;">
                <?php echo get_avatar(get_the_author_meta('ID'), 96); ?>
            </div>
            <h1><?php the_author(); ?></h1>
            <p><?php the_author_meta('description'); ?></p>
            <span style="font-size:0.85rem;color:#8A8A8A;"><?php echo count_user_posts(get_the_author_meta('ID')); ?> artículos publicados</span>
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
                <p>Este autor no ha publicado artículos aún.</p>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php get_footer(); ?>
